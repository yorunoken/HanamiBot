const fs = require("fs")
const { EmbedBuilder, AttachmentBuilder } = require("discord.js")
const { v2, auth } = require("osu-api-extended")
const Chart = require("chart.js")
const Canvas = require("canvas")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
		} else {
			try {
				const userData = JSON.parse(data)
				let userargs

				let mode
				try {
					mode = userData[message.author.id].osumode
					if (mode == undefined) mode = "osu"
				} catch (err) {
					mode = "osu"
				}

				if (message.mentions.users.size > 0) {
					const mentionedUser = message.mentions.users.first()
					try {
						if (mentionedUser) {
							if (message.content.includes(`<@${mentionedUser.id}>`)) {
								userargs = userData[mentionedUser.id].osuUsername
							} else {
								userargs = userData[message.author.id].osuUsername
							}
						}
					} catch (err) {
						console.error(err)
						if (mentionedUser) {
							if (message.content.includes(`<@${mentionedUser.id}>`)) {
								try {
									userargs = userData[mentionedUser.id].osuUsername
								} catch (err) {
									message.reply(`No osu! user found for ${mentionedUser.tag}`)
								}
							} else {
								try {
									userargs = userData[message.author.id].osuUsername
								} catch (err) {
									message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
								}
							}
						}
						return
					}
				} else {
					if (args[0] === undefined) {
						try {
							userargs = userData[message.author.id].osuUsername
						} catch (err) {
							console.error(err)
							message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
							return
						}
					} else {
						let string = args.join(" ").match(/"(.*?)"/)
						if (string) {
							userargs = string[1]
						} else {
							userargs = args[0]
						}
					}
				}

				if (args.join(" ").startsWith("-graph") || args.join(" ").startsWith("-g") || args.join(" ").startsWith("-pc") || args.join(" ").startsWith("-playcount")) {
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					}
				}

				if (args.includes("-osu")) {
					mode = "osu"
				}
				if (args.includes("-mania")) {
					mode = "mania"
				}
				if (args.includes("-taiko")) {
					mode = "taiko"
				}
				if (args.includes("-ctb")) {
					mode = "fruits"
				}

				if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-osu")) {
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					}
				}

				//log into api
				await auth.login(process.env.client_id, process.env.client_secret)
				const user = await v2.user.details(userargs, mode)

				try {
					if (user.id == undefined) throw new Error("The user doesn't exist")
				} catch (err) {
					message.reply(`**The user \`${userargs}\` doesn't exist**`)
					return
				}

				const canvas = Canvas.createCanvas(1000, 600)
				const ctx = canvas.getContext("2d")
				const plugin = {
					id: "custom_canvas_background_color",
					beforeDraw: chart => {
						ctx.save()
						ctx.globalCompositeOperation = "destination-over"
						ctx.fillStyle = "#36393E"
						ctx.fillRect(0, 0, chart.width, chart.height)
						ctx.restore()
					},
				}

				var gradient = ctx.createLinearGradient(0, 0, 0, 450)
				gradient.addColorStop(0, "rgba(207, 107, 107, 0.35)")
				gradient.addColorStop(1, "rgba(207, 107, 107, 0.05)")

				var gradientPC = ctx.createLinearGradient(0, 0, 0, 450)
				gradientPC.addColorStop(0, "rgba(124, 235, 235, 0.35)")
				gradientPC.addColorStop(1, "rgba(124, 235, 235, 0.05)")

				var gradientReplay = ctx.createLinearGradient(0, 0, 0, 450)
				gradientReplay.addColorStop(0, "rgba(235, 124, 217, 0.35)")
				gradientReplay.addColorStop(1, "rgba(235, 124, 217, 0.05)")

				if (args.includes("-pc") || args.includes("-playcount")) {
					// monthly playcount
					const fixed_monthly_playcounts = []
					for (let i = 0; i < user.monthly_playcounts.length; i++) {
						fixed_monthly_playcounts.push(user.monthly_playcounts[i])
						if (i < user.monthly_playcounts.length - 1) {
							const currentStart = new Date(user.monthly_playcounts[i].start_date)
							const nextStart = new Date(user.monthly_playcounts[i + 1].start_date)
							while (nextStart > currentStart.setMonth(currentStart.getMonth() + 1)) {
								fixed_monthly_playcounts.push({
									start_date: currentStart.toISOString().slice(0, 7) + "-01",
									count: 0,
								})
							}
						}
					}

					// replay count
					const fixed_replay_count = []
					for (let i = 0; i < user.replays_watched_counts.length; i++) {
						fixed_replay_count.push(user.replays_watched_counts[i])
						if (i < user.replays_watched_counts.length - 1) {
							const currentStart = new Date(user.replays_watched_counts[i].start_date)
							const nextStart = new Date(user.replays_watched_counts[i + 1].start_date)
							while (nextStart > currentStart.setMonth(currentStart.getMonth() + 1)) {
								fixed_replay_count.push({
									start_date: currentStart.toISOString().slice(0, 7) + "-01",
									count: 0,
								})
							}
						}
					}

					fixed_replay_count.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
					fixed_monthly_playcounts.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

					const first_replay_count_start_date = new Date(fixed_replay_count[0].start_date)
					const first_monthly_playcounts_start_date = new Date(fixed_monthly_playcounts[0].start_date)

					if (first_replay_count_start_date < first_monthly_playcounts_start_date) {
						while (first_replay_count_start_date < first_monthly_playcounts_start_date) {
							fixed_monthly_playcounts.unshift({
								start_date: first_replay_count_start_date.toISOString().slice(0, 7) + "-01",
								count: 0,
							})
							first_replay_count_start_date.setMonth(first_replay_count_start_date.getMonth() + 1)
						}
					}
					if (first_monthly_playcounts_start_date < first_replay_count_start_date) {
						while (first_monthly_playcounts_start_date < first_replay_count_start_date) {
							fixed_replay_count.unshift({ start_date: first_monthly_playcounts_start_date.toISOString().slice(0, 7) + "-01", count: 0 })
							first_monthly_playcounts_start_date.setMonth(first_monthly_playcounts_start_date.getMonth() + 1)
						}
					}

					fixed_replay_count.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
					fixed_monthly_playcounts.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

					const Data_Date = fixed_monthly_playcounts.map(item => item.start_date)
					let Data_PC_Count = fixed_monthly_playcounts.map(item => item.count)
					let Data_Replay_count = fixed_replay_count.map(x => x.count)

					if (args.includes("-replay") || args.includes("-r")) {
						new Chart(ctx, {
							type: "line",
							plugins: [plugin],
							data: {
								labels: Data_Date,
								datasets: [
									// Playcount
									{
										label: "Play Count",
										backgroundColor: gradientPC,
										borderColor: "rgba(124, 235, 142)",
										fill: true,
										pointRadius: 0,
										tension: 0.3,
										data: Data_PC_Count,
										fill: "start",
									},
									// Replays
									{
										label: "Replays Watched",
										backgroundColor: gradientReplay,
										borderColor: "rgb(235, 124, 217)",
										fill: true,
										pointRadius: 0,
										data: Data_Replay_count,
										fill: "start",
										tension: 0.2,
										yAxisID: "Replays",
									},
								],
							},
							options: {
								plugins: {
									legend: {
										labels: {
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
											},
										},
									},
								},
								scales: {
									// y
									y: {
										ticks: {
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
												size: 15,
											},
										},
										grid: {
											borderColor: "rgba(96, 201, 64, 0.5)",
											color: "rgba(96, 201, 64, 0.5)",
										},
										title: {
											display: true,
											text: "Play Count",
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
												size: 18,
											},
										},
									},

									// Replays
									Replays: {
										position: "right",
										ticks: {
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
												size: 15,
											},
										},
										title: {
											display: true,
											text: "Replays Watched",
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
												size: 18,
											},
										},
									},

									// x
									x: {
										ticks: {
											maxTicksLimit: 20,
											color: "rgba(255,255,255)",
											font: {
												weight: "bold",
												size: 12,
											},
										},
										title: {
											display: true,
											text: "Months",
											color: "rgba(255,255,255",
											font: {
												weight: "bold",
												size: 18,
											},
										},
									},
								},
							},
						})

						const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "chart.png" })

						try {
							global_rank = user.statistics.global_rank.toLocaleString()
							country_rank = user.statistics.country_rank.toLocaleString()
							pp = user.statistics.pp.toLocaleString()
						} catch (err) {
							global_rank = "0"
							country_rank = "0"
							pp = "0"
						}

						const embed = new EmbedBuilder()
							.setColor("Purple")
							.setAuthor({
								name: `Graph for ${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
								iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
								url: `https://osu.ppy.sh/users/${user.id}`,
							})
							.setImage("attachment://chart.png")

						message.channel.send({ embeds: [embed], files: [attachment] })

						return
					}

					new Chart(ctx, {
						type: "line",
						plugins: [plugin],
						data: {
							labels: Data_Date,
							datasets: [
								// Playcount
								{
									label: "Play Count",
									backgroundColor: gradientPC,
									borderColor: "rgba(124, 235, 235)",
									fill: true,
									pointRadius: 0,
									tension: 0.3,
									data: Data_PC_Count,
									fill: "start",
								},
							],
						},
						options: {
							plugins: {
								legend: {
									labels: {
										color: "rgba(255,255,255)",
										font: {
											weight: "bold",
										},
									},
								},
							},
							scales: {
								// y
								y: {
									ticks: {
										color: "rgba(255,255,255)",
										font: {
											weight: "bold",
											size: 15,
										},
									},
									grid: {
										borderColor: "rgba(96, 201, 64, 0.5)",
										color: "rgba(96, 201, 64, 0.5)",
									},
									title: {
										display: true,
										text: "Play Count",
										color: "rgba(255,255,255)",
										font: {
											weight: "bold",
											size: 18,
										},
									},
								},

								// x
								x: {
									ticks: {
										maxTicksLimit: 20,
										color: "rgba(255,255,255)",
										font: {
											weight: "bold",
											size: 12,
										},
									},
									title: {
										display: true,
										text: "Months",
										color: "rgba(255,255,255",
										font: {
											weight: "bold",
											size: 18,
										},
									},
								},
							},
						},
					})

					const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "chart.png" })

					try {
						global_rank = user.statistics.global_rank.toLocaleString()
						country_rank = user.statistics.country_rank.toLocaleString()
						pp = user.statistics.pp.toLocaleString()
					} catch (err) {
						global_rank = "0"
						country_rank = "0"
						pp = "0"
					}

					const embed = new EmbedBuilder()
						.setColor("Purple")
						.setAuthor({
							name: `PlayCount Graph for ${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
							iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
							url: `https://osu.ppy.sh/users/${user.id}`,
						})
						.setImage("attachment://chart.png")

					message.channel.send({ embeds: [embed], files: [attachment] })

					return
				}

				let dayNumber = 90
				let dayArray = []

				do {
					dayArray.push(dayNumber)
					dayNumber--
				} while (dayNumber > 0)

				const days = dayArray

				try {
					RankData = user.rankHistory.data
				} catch (err) {
					message.reply("**Not enough plays.**")
				}

				new Chart(ctx, {
					type: "line",
					plugins: [plugin],
					data: {
						labels: days,
						datasets: [
							{
								label: "Rank",
								backgroundColor: gradient,
								borderColor: "rgba(235, 124, 124)",
								fill: true,
								pointRadius: 0,
								data: RankData,
								tension: 0.3,
								fill: "start",
							},
						],
					},
					options: {
						plugins: {
							legend: {
								labels: {
									color: "rgba(255,255,255)",
									font: {
										weight: "bold",
									},
								},
							},
						},
						scales: {
							y: {
								reverse: true,
								ticks: {
									color: "rgba(255,255,255)",
									font: {
										weight: "bold",
										size: 15,
									},
								},
								grid: {
									borderColor: "rgba(96, 201, 64, 0.5)",
									color: "rgba(96, 201, 64, 0.5)",
								},
								title: {
									display: true,
									text: "Rank",
									color: "rgba(255,255,255)",
									font: {
										weight: "bold",
										size: 18,
									},
								},
							},
							x: {
								ticks: {
									maxTicksLimit: 20,
									color: "rgba(255,255,255)",
									font: {
										weight: "bold",
										size: 15,
									},
								},
								title: {
									display: true,
									text: "Days ago",
									color: "rgba(255,255,255",
									font: {
										weight: "bold",
										size: 18,
									},
								},
							},
						},
					},
				})

				console.log(userargs, "graph.")

				const max_rank = Math.max(...RankData)
				const min_rank = Math.min(...RankData)

				const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "chart.png" })

				try {
					global_rank = user.statistics.global_rank.toLocaleString()
					country_rank = user.statistics.country_rank.toLocaleString()
					pp = user.statistics.pp.toLocaleString()
				} catch (err) {
					global_rank = "0"
					country_rank = "0"
					pp = "0"
				}

				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `Rank Graph for ${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
						iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
						url: `https://osu.ppy.sh/users/${user.id}`,
					})
					.setImage("attachment://chart.png")

				message.channel.send({ content: `**Worst:** \`#${max_rank.toLocaleString()}\`\n**Best:** \`#${min_rank.toLocaleString()}\``, embeds: [embed], files: [attachment] })

				return
			} catch (err) {
				console.log(err)
			}
		}
	})
}
exports.name = "graph"
exports.aliases = ["graph", "g"]
exports.description = ["Displays desired graph of a user, leave arguments blank for rank graph, add `-pc` at the end for play count graph, add `-replay` after `-pc` to get both replay watched count and play count graph at the same time."]
exports.usage = [`graph YoruNoKen -pc -replay\ngraph Blackdog5`]
exports.category = ["osu"]
